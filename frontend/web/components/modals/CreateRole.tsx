import React, {
  FC,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import InputGroup from 'components/base/forms/InputGroup'
import Tabs from 'components/base/forms/Tabs'
import TabItem from 'components/base/forms/TabItem'
import CollapsibleNestedRolePermissionsList from 'components/CollapsibleNestedRolePermissionsList'
import {
  useCreateRoleMutation,
  useGetRoleQuery,
  useUpdateRoleMutation,
} from 'common/services/useRole'

import { EditPermissionsModal } from 'components/EditPermissions'
import OrganisationStore from 'common/stores/organisation-store'
import ProjectFilter from 'components/ProjectFilter'
import {
  Environment,
  Project,
  Role,
  User,
  UserGroup,
} from 'common/types/responses'
import { setInterceptClose } from './base/ModalDefault'
import UserSelect from 'components/UserSelect'
import MyGroupsSelect from 'components/MyGroupsSelect'
import {
  useCreateRolesPermissionUsersMutation,
  useDeleteRolesPermissionUsersMutation,
  useGetRolesPermissionUsersQuery,
} from 'common/services/useRolesUser'
import {
  useCreateRolePermissionGroupMutation,
  useDeleteRolePermissionGroupMutation,
  useGetRolePermissionGroupQuery,
} from 'common/services/useRolePermissionGroup'
import { close as closeIcon } from 'ionicons/icons'
import { IonIcon } from '@ionic/react'
import Utils from 'common/utils/utils'
import Button from 'components/base/forms/Button'
import Input from 'components/base/forms/Input'

type TabRef = {
  onClosing: () => Promise<void>
  tabChanged: () => boolean
}
type CreateRoleType = {
  groups: UserGroup[]
  isEdit?: boolean
  onComplete: () => void
  organisationId?: number
  role: Role
  users: User[]
}
const CreateRole: FC<CreateRoleType> = ({
  groups,
  isEdit,
  onComplete,
  organisationId,
  role,
  users,
}) => {
  const buttonText = isEdit ? 'Update Role' : 'Create Role'
  const [tab, setTab] = useState<number>(0)
  const [userGroupTab, setUserGroupTab] = useState<number>(0)
  const [project, setProject] = useState<string>('')
  const [environments, setEnvironments] = useState<Environment[]>([])
  const [showUserSelect, setShowUserSelect] = useState<boolean>(false)
  const [showGroupSelect, setShowGroupSelect] = useState<boolean>(false)
  const [userSelected, setUserSelected] = useState<
    {
      user_role_id: number
      user: number
    }[]
  >([])
  const [groupSelected, setGroupSelected] = useState<
    {
      group: number
      role_group_id: number
    }[]
  >([])

  const projectData: Project[] = OrganisationStore.getProjects()

  const [createRolePermissionUser, { data: usersData, isSuccess: userAdded }] =
    useCreateRolesPermissionUsersMutation()

  const [deleteRolePermissionUser, { isSuccess: roleUserDeleted }] =
    useDeleteRolesPermissionUsersMutation()

  const [
    createRolePermissionGroup,
    { data: groupsData, isSuccess: groupAdded },
  ] = useCreateRolePermissionGroupMutation()

  const [deleteRolePermissionGroup, { isSuccess: roleGroupDeleted }] =
    useDeleteRolePermissionGroupMutation()

  const {
    data: userList,
    isSuccess,
    refetch,
  } = useGetRolesPermissionUsersQuery(
    {
      organisation_id: organisationId!,
      role_id: role?.id,
    },
    { skip: !role || !organisationId },
  )

  const {
    data: groupList,
    isSuccess: groupListLoaded,
    refetch: refetchGroups,
  } = useGetRolePermissionGroupQuery(
    {
      organisation_id: organisationId!,
      role_id: role?.id,
    },
    { skip: !role || !organisationId },
  )

  useEffect(() => {
    if (userAdded || roleUserDeleted) {
      refetch()
    }
  }, [userAdded, roleUserDeleted, refetch])

  useEffect(() => {
    if (groupAdded || roleGroupDeleted) {
      refetchGroups()
    }
  }, [groupAdded, roleGroupDeleted, refetchGroups])

  useEffect(() => {
    if (isSuccess && userList.results) {
      setUserSelected(
        userList.results.map((u) => ({
          user: u.user,
          user_role_id: u.id,
        })),
      )
    }
  }, [userList, isSuccess])

  useEffect(() => {
    if (groupListLoaded && groupList?.results) {
      setGroupSelected(
        groupList.results.map((g) => ({
          group: g.group,
          role_group_id: g.id,
        })),
      )
    }
  }, [groupList, groupListLoaded])

  const addUserOrGroup = (id: number, isUser = true) => {
    if (!organisationId) return
    if (isUser) {
      createRolePermissionUser({
        data: {
          user: id,
        },
        organisation_id: organisationId,
        role_id: role.id,
      })
    } else {
      createRolePermissionGroup({
        data: {
          group: id,
        },
        organisation_id: organisationId,
        role_id: role.id,
      })
    }
  }
  const removeUserOrGroup = (id: number, isUser = true) => {
    const userRole = usersAdded.find((item) => item.id === id)
    if (!organisationId) return
    if (isUser) {
      if (userRole) {
        deleteRolePermissionUser({
          organisation_id: organisationId,
          role_id: role.id,
          user_id: userRole?.user_role_id,
        }).then((res) => {
          // @ts-ignore rtk types are wrong
          if (!res.error) {
            toast('User role was removed')
          }
        })
        setUserSelected((userSelected || []).filter((v) => v.user !== id))
      }
    } else {
      const groupRole = groupsAdded.find((item) => item.id === id)
      if (groupRole && organisationId) {
        deleteRolePermissionGroup({
          group_id: groupRole.role_group_id,
          organisation_id: organisationId,
          role_id: role.id,
        })
        setGroupSelected((groupSelected || []).filter((v) => v.group !== id))
        toast('Group role was removed')
      }
    }
  }

  const usersAdded = useMemo(() => {
    return (users || [])
      ?.filter((v) => userSelected?.find((a) => a.user === v.id))
      .map((user) => {
        const matchedRole = userSelected!.find((role) => role.user === user.id)!
        return {
          ...user,
          user_role_id: matchedRole.user_role_id,
        }
      })
  }, [users, userSelected])

  const groupsAdded = useMemo(() => {
    return (groups || [])
      .filter((v) => groupSelected.find((a) => a.group === v.id))
      .map((group) => {
        const matchingGroup = groupSelected.find(
          (selected) => selected.group === group.id,
        )
        return { ...group, role_group_id: matchingGroup!.role_group_id }
      })
  }, [groups, groupSelected])

  useEffect(() => {
    if (project && projectData) {
      const environments = projectData.find(
        (p) => p.id === parseInt(project),
      )?.environments
      setEnvironments(environments || [])
    }
  }, [project, projectData])

  useEffect(() => {
    if (userAdded && usersData) {
      setUserSelected(
        (userSelected || []).concat({
          user: usersData.user,
          user_role_id: usersData.id,
        }),
      )
      toast('Role assigned')
    }
    //eslint-disable-next-line
  }, [userAdded, usersData])

  useEffect(() => {
    if (groupAdded && groupsData) {
      setGroupSelected(
        (groupSelected || []).concat({
          group: groupsData.group,
          role_group_id: groupsData.id,
        }),
      )
      toast('Role assigned')
    }
    //eslint-disable-next-line
  }, [groupAdded, groupsData])

  const Tab1 = forwardRef((props, ref) => {
    const { data: roleData, isLoading } = useGetRoleQuery(
      {
        organisation_id: role?.organisation as any,
        role_id: role?.id as any,
      },
      { skip: !role || !organisationId },
    )
    const [roleName, setRoleName] = useState<string>('')
    const [roleDesc, setRoleDesc] = useState<string>('')
    const [isSaving, setIsSaving] = useState<boolean>(false)
    const [roleNameChanged, setRoleNameChanged] = useState<boolean>(false)
    const [roleDescChanged, setRoleDescChanged] = useState<boolean>(false)

    useImperativeHandle(
      ref,
      () => {
        return {
          onClosing() {
            if (roleNameChanged || roleDescChanged) {
              return new Promise((resolve) => {
                openConfirm({
                  body: 'Closing this will discard your unsaved changes.',
                  noText: 'Cancel',
                  onNo: () => resolve(false),
                  onYes: () => resolve(true),
                  title: 'Discard changes',
                  yesText: 'Ok',
                })
              })
            } else {
              return Promise.resolve(true)
            }
          },
          tabChanged() {
            return roleNameChanged || roleDescChanged
          },
        }
      },
      [roleNameChanged, roleDescChanged],
    )
    useEffect(() => {
      if (!isLoading && isEdit && roleData) {
        setRoleName(roleData.name)
        setRoleDesc(roleData.description || '')
      }
    }, [roleData, isLoading])

    const [createRole, { isSuccess: createSuccess }] = useCreateRoleMutation()

    const [editRole, { isSuccess: updateSuccess }] = useUpdateRoleMutation()

    useEffect(() => {
      if (createSuccess || updateSuccess) {
        setRoleNameChanged(false)
        setRoleDescChanged(false)
        setIsSaving(false)
        onComplete?.()
      }
    }, [createSuccess, updateSuccess])

    const save = () => {
      if (!organisationId) return
      if (isEdit) {
        editRole({
          body: { description: roleDesc, name: roleName },
          organisation_id: role.organisation,
          role_id: role.id,
        })
      } else {
        createRole({
          description: roleDesc,
          name: roleName,
          organisation_id: organisationId,
        })
      }
    }

    return isLoading ? (
      <div className='text-center'>
        <Loader />
      </div>
    ) : (
      <div className='my-4'>
        <InputGroup
          title='Role name'
          inputProps={{
            className: 'full-width',
            name: 'roleName',
          }}
          value={roleName}
          unsaved={isEdit && roleNameChanged}
          onChange={(event) => {
            setRoleNameChanged(true)
            setRoleName(Utils.safeParseEventValue(event))
          }}
          id='roleName'
          placeholder='E.g. Viewers'
        />
        <InputGroup
          title='Role Description'
          inputProps={{
            className: 'full-width',
            name: 'description',
          }}
          value={roleDesc}
          unsaved={isEdit && roleDescChanged}
          onChange={(event: InputEvent) => {
            setRoleDescChanged(true)
            setRoleDesc(Utils.safeParseEventValue(event))
          }}
          id='description'
          placeholder='E.g. Some role description'
        />
        <div className='text-right mb-2'>
          <Button
            onClick={() => save()}
            data-test='update-role-btn'
            id='update-role-btn'
            disabled={isSaving || !roleName}
          >
            {isSaving && isEdit
              ? 'Updating'
              : isSaving && !isEdit
              ? 'Creating'
              : buttonText}
          </Button>
        </div>
      </div>
    )
  })

  const TabValue = () => {
    const [searchProject, setSearchProject] = useState<string>('')
    const [searchEnv, setSearchEnv] = useState<string>('')
    const ref = useRef<TabRef>(null)
    const ref2 = useRef<TabRef>(null)
    useEffect(() => {
      if (isEdit) {
        setInterceptClose(() => ref.current?.onClosing() || Promise.resolve())
      }
    }, [])

    const changeTab = (newTab: number) => {
      const changed = ref.current!.tabChanged()
      if (changed && newTab !== tab) {
        return new Promise((resolve) => {
          openConfirm({
            body: 'Changing this tab will discard your unsaved changes.',
            noText: 'Cancel',
            onNo: () => resolve(false),
            onYes: () => {
              resolve(true), setTab(newTab)
            },
            title: 'Discard changes',
            yesText: 'Ok',
          })
        })
      } else {
        setTab(newTab)
      }
    }

    return isEdit ? (
      <Tabs value={tab} onChange={changeTab} buttonTheme='text'>
        <TabItem tabLabel={<Row className='justify-content-center'>Role</Row>}>
          <Tab1 ref={ref} />
        </TabItem>
        <TabItem
          tabLabel={<Row className='justify-content-center'>Members</Row>}
        >
          <h5 className='mt-4 title'>Assign Roles</h5>
          <Tabs
            value={userGroupTab}
            onChange={setUserGroupTab}
            theme='pill m-0'
            isRoles={true}
          >
            <TabItem
              tabLabel={<Row className='justify-content-center'>Users</Row>}
            >
              <div>
                <h5 style={{ width: 110 }} className='mt-4'>
                  Users List:
                </h5>
                <Row>
                  <Button theme='text' onClick={() => setShowUserSelect(true)}>
                    Assign role to user
                  </Button>
                  {showUserSelect && (
                    <UserSelect
                      users={users}
                      value={usersAdded && usersAdded.map((v) => v.id)}
                      onAdd={addUserOrGroup}
                      onRemove={removeUserOrGroup}
                      isOpen={showUserSelect}
                      onToggle={() => setShowUserSelect(!showUserSelect)}
                      size='-sm'
                    />
                  )}
                </Row>
                {usersAdded.length !== 0 &&
                  usersAdded.map((u) => (
                    <Row
                      key={u.id}
                      onClick={() => removeUserOrGroup(u.id)}
                      className='chip my-1 role-list'
                    >
                      <span className='font-weight-bold'>
                        {u.first_name} {u.last_name}
                      </span>
                      <span className='chip-icon ion'>
                        <IonIcon
                          icon={closeIcon}
                          style={{ fontSize: '13px' }}
                        />
                      </span>
                    </Row>
                  ))}
              </div>
            </TabItem>
            <TabItem
              tabLabel={<Row className='justify-content-center'>Groups</Row>}
            >
              <div>
                <h5 style={{ width: 120 }} className='mt-4'>
                  Groups List:
                </h5>
                <Row>
                  <Button theme='text' onClick={() => setShowGroupSelect(true)}>
                    Assign role to group
                  </Button>
                  {showGroupSelect && organisationId && (
                    <MyGroupsSelect
                      orgId={organisationId}
                      value={groupsAdded && groupsAdded.map((v) => v.id)}
                      onAdd={addUserOrGroup}
                      onRemove={removeUserOrGroup}
                      isOpen={showGroupSelect}
                      onToggle={() => setShowGroupSelect(!showGroupSelect)}
                      size='-sm'
                    />
                  )}
                </Row>
                {groupsAdded.length !== 0 &&
                  groupsAdded.map((g) => (
                    <Row
                      key={g.id}
                      onClick={() => removeUserOrGroup(g.id, false)}
                      className='chip my-1 role-list'
                    >
                      <span className='font-weight-bold'>{g.name}</span>
                      <span className='chip-icon ion'>
                        <IonIcon
                          icon={closeIcon}
                          style={{ fontSize: '13px' }}
                        />
                      </span>
                    </Row>
                  ))}
              </div>
            </TabItem>
          </Tabs>
        </TabItem>
        <TabItem
          tabLabel={<Row className='justify-content-center'>Organisation</Row>}
        >
          <EditPermissionsModal level={'organisation'} role={role} />
        </TabItem>
        <TabItem
          tabLabel={<Row className='justify-content-center'>Project</Row>}
        >
          <Row className='role-list'>
            <h5 className='my-4 title'>Edit Permissions</h5>
            <Input
              type='text'
              className='ml-3'
              value={searchProject}
              onChange={(e: InputEvent) =>
                setSearchProject(Utils.safeParseEventValue(e))
              }
              size='small'
              placeholder='Search'
              search
            />
          </Row>
          <CollapsibleNestedRolePermissionsList
            filter={searchProject}
            mainItems={projectData}
            role={role}
            level={'project'}
            ref={ref}
          />
        </TabItem>
        <TabItem
          tabLabel={<Row className='justify-content-center'>Environment</Row>}
        >
          <Row className='role-list'>
            <h5 className='my-4 title'>Edit Permissions</h5>
            <Input
              type='text'
              className='ml-3'
              value={searchEnv}
              onChange={(e: InputEvent) =>
                setSearchEnv(Utils.safeParseEventValue(e))
              }
              size='small'
              placeholder='Search'
              search
            />
          </Row>
          <ProjectFilter
            organisationId={role.organisation}
            onChange={setProject}
            value={project}
          />
          {environments.length > 0 && (
            <CollapsibleNestedRolePermissionsList
              filter={searchEnv}
              mainItems={environments}
              role={role}
              level={'environment'}
              ref={ref}
            />
          )}
        </TabItem>
      </Tabs>
    ) : (
      <div className='my-3 mx-4'>
        <Tab1 />
      </div>
    )
  }

  return (
    <div id='create-feature-modal'>
      <TabValue />
    </div>
  )
}
export default CreateRole
module.exports = CreateRole
